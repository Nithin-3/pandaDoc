import {mediaDevices,MediaStream,RTCPeerConnection,RTCIceCandidate,RTCSessionDescription,RTCDataChannel} from 'react-native-webrtc'
export interface Handlers {
    onRemStrm?:(strm:MediaStream,peerId:string) => void;
    onICE?:(candidate:RTCIceCandidate,peerId:string) => void;
    onData?:(data:string,peerId:string)=>void;
    onDatOpen?:(peerId:string)=>void;
    onDatClose?:(peerId:string)=>void;
}
export const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};
export let peer:P2P|null = null;
export class P2P{
    private peer= new Map<string, RTCPeerConnection>();
    private locStream: MediaStream | null = null;
    private remStream= new Map<String,MediaStream>();
    private dataChannel = new Map<String,RTCDataChannel>();
    private handlers: Handlers = {};

    constructor(handlers: Handlers = {}) {
        this.handlers = handlers;
        peer = this; 
    }

    getLocStrm(){
        return this.locStream;
    }

   getRemStrm(peerId: string) {
        return this.remStream.get(peerId) || null;
    }

    getPeer(peerId: string) {
        return this.peer.get(peerId) || null;
    }

    getDatChannel(peerId: string) {
        return this.dataChannel.get(peerId) || null;
    }
    async stStrm(video: boolean | MediaTrackConstraints,peerId: string){
        if(this.locStream) return this.locStream;
        const strm = await mediaDevices.getUserMedia({audio:true,video})
        this.locStream = strm;
        const pr = this.getPeer(peerId);
        if(pr){
            strm.getTracks().forEach(t=>pr.addTrack(t,strm!))
        }else{
            await this.initPeer(peerId);
        }
        return strm;
    }

 
    async initPeer(peerId:string,dataChannel:boolean = false){
        const pr = this.getPeer(peerId);
        if(pr) return pr;
        const peer = new RTCPeerConnection(config)
        this.locStream && this.locStream.getTracks().forEach(t=>peer.addTrack(t,this.locStream!))
        peer.onicecandidate = e=>{
            e.candidate && this.handlers.onICE?.(e.candidate,peerId);
        }
       peer.oniceconnectionstatechange = () => {
            const state = peer.iceConnectionState;
            if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                this.handlers.onDatClose?.(peerId);
                this.close(peerId)
            }
        }
        peer.ontrack = e=>{
            let stream = this.remStream.get(peerId);
            if (!stream) {
                stream = new MediaStream();
                this.remStream.set(peerId, stream);
                this.handlers.onRemStrm?.(stream, peerId);
            }
            stream.addTrack(e.track); 
        }
        if (dataChannel) {
            const dataChannel = peer.createDataChannel('chat',{ordered:true});
            this.setDatChannel(dataChannel,peerId);
        } else {
            peer.ondatachannel = (event:any) => {
                const dataChannel = event.channel;
                this.setDatChannel(dataChannel,peerId);
            };
        }
        this.peer.set(peerId,peer)
        return peer;
    }

    async initData(peerId:string){
        const dc = this.dataChannel.get(peerId);
        if(dc) return dc;
        const peer = await this.initPeer(peerId);
        return this.setDatChannel(peer.createDataChannel('chat',{ordered:true}),peerId)
    }

    private setDatChannel(chan:RTCDataChannel,peerId:string){
        chan.onopen = () => {
            this.handlers.onDatOpen?.(peerId);
        };

        chan.onclose = () => {
            this.handlers.onDatClose?.(peerId);
            this.close(peerId)
        };

        chan.onerror = (e:any) => {
            console.error('[RTC] DataChannel error', e);
        };
        chan.onmessage = (e:any) => {
            this.handlers.onData?.(e.data,peerId);
        };
        this.dataChannel.set(peerId,chan)
        return chan;
    }

    async crOff(peerId: string) {
        let peer = this.getPeer(peerId);
        if (!peer) {
            await this.initPeer(peerId);
            peer = this.getPeer(peerId);
            if (!peer) throw new Error('Peer init failed');
        }
        if (peer.iceConnectionState === 'connected') throw new Error('Peer already connected');
        const off = await peer.createOffer();
        await peer.setLocalDescription(off);
        return off;
    }

    async crAns(peerId: string) {
        let peer = this.getPeer(peerId);
        if (!peer) {
            await this.initPeer(peerId);
            peer = this.getPeer(peerId);
            if (!peer) throw new Error('Peer init failed');
        }
        const ans = await peer.createAnswer();
        await peer.setLocalDescription(ans);
        return ans;
    }

    async setRemDisc(peerId: string, disc: RTCSessionDescriptionInit) {
        const peer = this.getPeer(peerId);
        if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(disc));
        }
    }

    
   async addICE(peerId: string, candidate: RTCIceCandidateInit) {
        const peer = this.getPeer(peerId);
        if(!peer) throw `404 peer ${peerId}: addICE`;
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
    
    async replaceVid(track:MediaStreamTrack,peerId:string){
        const sender = this.peer.get(peerId)?.getSenders().find(s=>s.track?.kind === "video");
        sender && await sender.replaceTrack(track)
    }
    
    enStrm(){
        this.locStream?.getTracks().forEach((t) => t.stop());
        this.remStream.forEach(s=>s.getTracks().forEach((t) => t.stop()));
        this.locStream = null;
        this.remStream.clear();
    }
    
    close(peerId:string){
        this.peer.get(peerId)?.close();
        this.peer.delete(peerId);
        this.dataChannel.get(peerId)?.close();
        this.dataChannel.delete(peerId);
    }
     clean(peerId:string){
        this.enStrm();
        this.close(peerId);
    }

    static waitForConnection(peer:RTCPeerConnection):Promise<void>{
        return new Promise((res,rej)=>{
            const ckSta = ()=>{
                if([ 'connected','completed'].includes(peer.iceConnectionState)){
                    clearTimeout(timeOut);
                    peer.removeEventListener('iceconnectionstatechange',ckSta);
                    res();
                }else if(['failed', 'disconnected', 'closed'].includes(peer.iceConnectionState)){
                    clearTimeout(timeOut);
                    peer.removeEventListener('iceconnectionstatechange',ckSta);
                    rej(new Error(`peer connection ${peer.iceConnectionState}`))
                }
            }
            peer.addEventListener('iceconnectionstatechange',ckSta);
            const timeOut = setTimeout(()=>{peer.removeEventListener('iceconnectionstatechange',ckSta); rej(new Error('Time Out'));},10000);
            setTimeout(ckSta,3000);
        });
    }

}
