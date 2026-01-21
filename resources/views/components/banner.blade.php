{{-- Version Update Banner - Shows when a new version is deployed --}}
{{-- Include in your layout: <x-version-notifier::components.banner /> --}}
@if(config('version-notifier.ui.enabled', true))
<div
    x-data="{ show: false }"
    x-on:app:update-available.window="show = true"
    x-show="show"
    x-cloak
    x-transition:enter="transition duration-300 ease-out"
    x-transition:enter-start="translate-y-4 opacity-0"
    x-transition:enter-end="translate-y-0 opacity-100"
    x-transition:leave="transition duration-200 ease-in"
    x-transition:leave-start="translate-y-0 opacity-100"
    x-transition:leave-end="translate-y-4 opacity-0"
    class="version-notifier-banner fixed right-4 bottom-4 z-50"
>
    <div
        class="version-notifier-banner-content flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg"
        style="background-color: var(--version-notifier-bg, #4f46e5); color: var(--version-notifier-text, #ffffff);"
    >
        {{-- Refresh Icon (slow spin animation) --}}
        <svg
            class="version-notifier-icon h-5 w-5 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            style="animation: version-notifier-spin 3s linear infinite;"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
        </svg>

        {{-- Message --}}
        <span class="version-notifier-message text-sm font-medium">
            {{ config('version-notifier.ui.message', 'A new version of ' . config('app.name', 'this application') . ' is available.') }}
        </span>

        {{-- Refresh Button --}}
        <button
            type="button"
            x-on:click="window.versionCheck.refresh()"
            class="version-notifier-refresh-btn rounded px-3 py-1 text-sm font-medium transition hover:scale-105"
            style="background-color: var(--version-notifier-btn-bg, #ffffff); color: var(--version-notifier-btn-text, #4f46e5);"
        >
            Refresh
        </button>

        {{-- Dismiss Button --}}
        <button
            type="button"
            x-on:click="
                window.versionCheck.dismiss()
                show = false
            "
            class="version-notifier-dismiss-btn transition"
            style="color: var(--version-notifier-dismiss, rgba(255, 255, 255, 0.7));"
            aria-label="Dismiss"
        >
            <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                />
            </svg>
        </button>
    </div>
</div>

{{-- Inline styles for the banner (no external CSS required) --}}
<style>
    [x-cloak] { display: none !important; }

    @keyframes version-notifier-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .version-notifier-banner {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .version-notifier-refresh-btn:hover {
        filter: brightness(0.95);
    }

    .version-notifier-dismiss-btn:hover {
        color: var(--version-notifier-dismiss-hover, #ffffff) !important;
    }

    /* Transition utilities for Alpine.js */
    .transition {
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
    }

    .duration-300 {
        transition-duration: 300ms;
    }

    .duration-200 {
        transition-duration: 200ms;
    }

    .ease-out {
        transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }

    .ease-in {
        transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
    }

    .translate-y-4 {
        transform: translateY(1rem);
    }

    .translate-y-0 {
        transform: translateY(0);
    }

    .opacity-0 {
        opacity: 0;
    }

    .opacity-100 {
        opacity: 1;
    }
</style>
@endif
