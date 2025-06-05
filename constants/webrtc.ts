import {mediaDevices,MediaStream,RTCPeerConnection,RTCIceCandidate,RTCSessionDescription,RTCDataChannel} from 'react-native-webrtc'
export interface Handlers {
    onRemStrm?:(strm:MediaStream) => void;
    onICE?:(candidate:RTCIceCandidate) => void;
    onData?:(data:string)=>void;
    onDatOpen?:()=>void;
    onDatClose?:()=>void;
}
export const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};
export class P2P{
    private peer: RTCPeerConnection | null = null;
    private locStream: MediaStream | null = null;
    private remStream: MediaStream | null = null;
    private dataChannel: RTCDataChannel | null = null;
    private handlers: Handlers = {};

    constructor(handlers: Handlers = {}) {
        this.handlers = handlers;
    }

    getLocStrm(){
        return this.locStream;
    }

    getRemStrm(){
        return this.remStream;
    }

    getPeer(){
        return this.peer;
    }

    async stStrm(video: boolean | MediaTrackConstraints = false){
        const strm = await mediaDevices.getUserMedia({audio:true,video})
        this.locStream = strm;
        return strm;
    }
 
    async initPeer(dataChannel:boolean = false){
        this.peer = new RTCPeerConnection(config)
        this.locStream && this.locStream.getTracks().forEach(t=>{this.peer?.addTrack(t,this.locStream)});
        this.peer.onicecandidate = e=>{
            e.candidate && this.handlers.onICE?.(e.candidate);
        }
        this.peer.oniceconnectionstatechange = () => {
            const state = this.peer?.iceConnectionState;
            if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                this.handlers.onDatClose?.();
            }
        }
        this.peer.ontrack = e=>{
            this.remStream = e.streams[0];
            this.handlers.onRemStrm?.(this.remStream);
        }
        if (dataChannel) {
            this.dataChannel = this.peer.createDataChannel('chat');
            this.setDatChannel(this.dataChannel);
        } else {
            this.peer.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setDatChannel(this.dataChannel);
            };
        }
    }

    private setDatChannel(chan:RTCDataChannel){
        chan.onopen = () => {
            console.log('[RTC] DataChannel opened');
            this.handlers.onDatOpen?.();
        };

        chan.onclose = () => {
            console.log('[RTC] DataChannel closed');
            this.handlers.onDatClose?.();
        };

        chan.onerror = (e) => {
            console.error('[RTC] DataChannel error', e);
        };

        chan.onmessage = (e) => {
            this.handlers.onData?.(e.data);
        };
    }

    async crOff(){
        if (!this.peer) throw new Error('Peer not initialized');
        const off = await this.peer?.createOffer();
        await this.peer?.setLocalDescription(off);
        return off;
    }

    async crAns(){
        if (!this.peer) throw new Error('Peer not initialized');
        const ans = await this.peer?.createAnswer();
        await this.peer?.setLocalDescription(ans);
        return ans;
    }
    
    async setRemDisc(disc:RTCSessionDescriptionInit){
        await this.peer?.setRemoteDescription(new RTCSessionDescription(disc));
    }
    
    async addICE(candidate:RTCIceCandidateInit){
        await this.peer?.addIceCandidate(new RTCIceCandidate(candidate))
    }
    
    async replaceVid(track:MediaStreamTrack){
        const sender = this.peer?.getSenders().find(s=>s.track?.kind === "video");
        sender && await sender.replaceTrack(track)
    }
    
    enStrm(){
        this.locStream?.getTracks().forEach((t) => t.stop());
        this.remStream?.getTracks().forEach((t) => t.stop());
        this.locStream = null;
        this.remStream = null;
    }
    
    close(){
        this.peer?.close();
        this.peer = null;
        this.dataChannel = null;
    }
     clean(){
        this.enStrm();
        this.close();
    }

}
