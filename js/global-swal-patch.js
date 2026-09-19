(function() {
    const OriginalSwalFire = Swal.fire;
    Swal.fire = function(...args) {
        let options = args[0];
        
        // Handle Swal.fire({ ... })
        if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
            // New flag: keepDeny - if true, we don't force hide the deny button
            if (options.keepDeny) {
                return OriginalSwalFire.apply(this, args);
            }
            
            const originalDidOpen = options.didOpen;
            options.didOpen = function(popup) {
                const denyBtn = popup.querySelector('.swal2-deny');
                // Only remove if it says 'No' or NO text is provided (default is often 'No' or hid)
                // or if it's explicitly shown but not whitelisted
                if (denyBtn && !options.keepDeny) {
                     // For backwards compatibility with user's previous request to remove ALL "No" buttons
                     // We check if it's the standard "No" or if the user didn't explicitly say keepDeny
                     denyBtn.remove();
                }
                if (originalDidOpen) originalDidOpen.call(this, popup);
            };
        } 
        // Handle Swal.fire('title', 'text', 'icon')
        else if (args.length >= 1 && typeof args[0] === 'string') {
             options = {
                 title: args[0],
                 text: args[1] || '',
                 icon: args[2] || null
             };
             options.didOpen = (popup) => {
                 const denyBtn = popup.querySelector('.swal2-deny');
                 if (denyBtn) denyBtn.remove();
             };
             return OriginalSwalFire.call(Swal, options);
        }
        
        return OriginalSwalFire.apply(this, args);
    };

    // Prevent Bootstrap 5 modal from trapping focus away from SweetAlert2 inputs
    document.addEventListener('focusin', function (e) {
        if (e.target.closest('.swal2-container')) {
            e.stopImmediatePropagation();
        }
    }, true);
})();
