import React, { createContext, useContext, useState } from 'react';

type FileStatus = {
  name: string;
  prog: string;
};

type FileMap = Record<string, FileStatus>;

const FileProgressContext = createContext<{fileMap:FileMap; setFileStatus:(id:string, data:Partial<FileStatus>)=>void;}>({fileMap: {},setFileStatus: () => {},});

export const FileProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fileMap, setFileMap] = useState<FileMap>({});

  const setFileStatus = (id: string, data: Partial<FileStatus>) => {
    setFileMap(prev => ({
      ...prev,
      [id]: { ...prev[id], ...data }
    }));
  };

  return (
    <FileProgressContext.Provider value={{ fileMap, setFileStatus }}>
      {children}
    </FileProgressContext.Provider>
  );
};

export const useFileProgress = () => useContext(FileProgressContext);

