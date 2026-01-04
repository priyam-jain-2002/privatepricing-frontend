import posthog from 'posthog-js'

export const analytics = {
    identify: (userId: string, traits?: Record<string, any>) => {
        if (posthog.__loaded) {
            posthog.identify(userId, traits)
        }
    },
    reset: () => {
        if (posthog.__loaded) {
            posthog.reset()
        }
    },
    capture: (eventName: string, properties?: Record<string, any>) => {
        if (posthog.__loaded) {
            posthog.capture(eventName, properties)
        }
    },
    group: (groupType: string, groupKey: string, groupProperties?: Record<string, any>) => {
        if (posthog.__loaded) {
            posthog.group(groupType, groupKey, groupProperties)
        }
    }
}
