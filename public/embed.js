/**
 * Eventzone Embeddable Ticket Widget Loader
 * Drop-in script for embedding ticket registration forms on any website.
 * 
 * Usage:
 * <div id="eventzone-tickets-widget" data-event-id="YOUR_EVENT_ID" data-theme="light" data-color="#2563eb"></div>
 * <script src="https://your-domain.com/embed.js" async></script>
 */
(function () {
  'use strict';

  function initEventzoneWidgets() {
    const containers = document.querySelectorAll('[data-event-id], #eventzone-tickets-widget, .eventzone-tickets');

    containers.forEach(function (container) {
      if (container.getAttribute('data-ez-initialized') === 'true') return;
      container.setAttribute('data-ez-initialized', 'true');

      const eventId = container.getAttribute('data-event-id') || container.getAttribute('data-event') || '';
      if (!eventId) {
        console.warn('[Eventzone Widget] Missing data-event-id attribute.');
        return;
      }

      const theme = container.getAttribute('data-theme') || 'light';
      const color = container.getAttribute('data-color') || container.getAttribute('data-primary-color') || '#2563eb';
      const hideHeader = container.getAttribute('data-hide-header') || 'false';
      const ticketId = container.getAttribute('data-ticket-id') || '';
      const lang = container.getAttribute('data-lang') || 'en';

      // Detect current origin or fallback
      let origin = '';
      const currentScript = document.currentScript || document.querySelector('script[src*="embed.js"]');
      if (currentScript && currentScript.src) {
        try {
          const urlObj = new URL(currentScript.src);
          origin = urlObj.origin;
        } catch (e) {}
      }
      if (!origin && typeof window !== 'undefined') {
        origin = window.location.origin;
      }

      const params = new URLSearchParams({
        eventId: eventId,
        theme: theme,
        primaryColor: color,
        hideHeader: hideHeader,
        lang: lang,
      });
      if (ticketId) params.set('ticketId', ticketId);

      const iframeSrc = origin + '/embed/tickets?' + params.toString();

      const iframe = document.createElement('iframe');
      iframe.src = iframeSrc;
      iframe.style.width = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '24px';
      iframe.style.overflow = 'hidden';
      iframe.style.minHeight = '480px';
      iframe.style.transition = 'height 0.25s ease';
      iframe.setAttribute('allowtransparency', 'true');
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('title', 'Eventzone Ticket Registration');

      container.innerHTML = '';
      container.appendChild(iframe);

      // Listen for resize messages from iframe
      window.addEventListener('message', function (e) {
        if (e.data && e.data.type === 'EVENTZONE_RESIZE' && typeof e.data.height === 'number') {
          iframe.style.height = e.data.height + 'px';
        }
        if (e.data && e.data.type === 'EVENTZONE_REGISTRATION_SUCCESS') {
          // Dispatch custom DOM event on host page
          const customEvt = new CustomEvent('eventzone:registered', { detail: e.data.data });
          window.dispatchEvent(customEvt);
          container.dispatchEvent(customEvt);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEventzoneWidgets);
  } else {
    initEventzoneWidgets();
  }
})();
