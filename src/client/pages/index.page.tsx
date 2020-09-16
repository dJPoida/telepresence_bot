import React from 'react';
import { SocketProvider } from '../providers/socket.provider';

export const IndexPage = () => {
    return (
        <SocketProvider>
            <div>
                Index Page Working
            </div>
        </SocketProvider>
    )
}