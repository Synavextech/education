/**
 * Live Support Chat Dispatcher Utility
 * Allows any button, link, or shortcut across the application to seamlessly redirect to
 * and open the system-based live support chat widget (SupportChatWidget).
 */
export function openLiveSupportChat(initialMessage?: string) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('open-support-chat', {
                detail: { message: initialMessage || '' }
            })
        );
    }
}
