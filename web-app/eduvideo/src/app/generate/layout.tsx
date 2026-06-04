import { ChatProvider } from '@/app/context/chatContext';

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
    return (
        <ChatProvider>
            {children}
        </ChatProvider>
    );
}