
/**
 * Checks for notification permission and requests it if necessary.
 * @returns Promise<boolean> - true if permission is granted, false otherwise.
 */
const checkAndRequestPermission = async (): Promise<boolean> => {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
        console.warn("This browser does not support desktop notification.");
        return false;
    }

    // Check if permission is already granted
    if (Notification.permission === 'granted') {
        return true;
    }

    // If permission has not been denied, ask for it
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    // Permission is denied
    return false;
};

/**
 * Shows a browser notification if permissions are granted and the tab is not active.
 * @param title The title of the notification.
 * @param options The options for the notification (e.g., body, icon).
 */
export const showNotification = async (title: string, options: NotificationOptions) => {
    // Only proceed if the page is hidden from view
    if (document.visibilityState !== 'hidden') {
        return;
    }

    const hasPermission = await checkAndRequestPermission();

    if (hasPermission) {
        // Create and display the notification
        new Notification(title, options);
    }
};
