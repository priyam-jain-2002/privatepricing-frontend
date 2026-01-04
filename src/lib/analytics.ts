import posthog from 'posthog-js'

const isPostHogLoaded = () => {
    return typeof window !== 'undefined' && posthog && posthog.__loaded
}

export const analytics = {
    identify: (userId: string, traits?: Record<string, any>) => {
        if (isPostHogLoaded()) {
            posthog.identify(userId, traits)
        }
    },
    reset: () => {
        if (isPostHogLoaded()) {
            posthog.reset()
        }
    },
    capture: (eventName: string, properties?: Record<string, any>) => {
        if (isPostHogLoaded()) {
            posthog.capture(eventName, properties)
        }
    },
    group: (groupType: string, groupKey: string, groupProperties?: Record<string, any>) => {
        if (isPostHogLoaded()) {
            posthog.group(groupType, groupKey, groupProperties)
        }
    }
}
