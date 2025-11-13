/**
 * Main JavaScript file for EDU-LMS application
 * Contains common functionality, utilities, and event handlers
 */

// Global application namespace
const EduLMS = {
    // Configuration
    config: {
        apiBaseUrl: '/api/v1',
        debounceDelay: 300,
        toastDuration: 5000
    },

    // Initialize application
    init: function() {
        this.setupEventListeners();
        this.setupAjaxCSRF();
        this.setupToastNotifications();
        this.setupFormValidations();
        this.setupUIComponents();
        console.log('EDU-LMS application initialized');
    },

    // Setup global event listeners
    setupEventListeners: function() {
        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('[data-mobile-menu]');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                mobileMenuBtn.classList.toggle('active');
            });
        }

        // Search functionality with debounce
        const searchInput = document.querySelector('[data-search]');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, this.config.debounceDelay));
        }

        // Dropdown menus
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-dropdown-toggle]')) {
                const dropdown = e.target.closest('.dropdown');
                dropdown.classList.toggle('active');
            } else {
                document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });

        // Modal handling
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-modal-toggle]')) {
                const modalId = e.target.getAttribute('data-modal-target');
                this.toggleModal(modalId, true);
            }
            
            if (e.target.matches('[data-modal-close]') || e.target.matches('.modal-overlay')) {
                this.toggleModal(null, false);
            }
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-tab]')) {
                this.switchTab(e.target);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('form[data-ajax]')) {
                e.preventDefault();
                this.handleAjaxForm(e.target);
            }
        });
    },

    // Setup AJAX CSRF token handling
    setupAjaxCSRF: function() {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': token
                }
            });
        }
    },

    // Setup toast notification system
    setupToastNotifications: function() {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(toastContainer);
    },

    // Show toast notification
    showToast: function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${this.getToastColor(type)};
            color: white;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
        `;

        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" style="
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
            ">&times;</button>
        `;

        const container = document.querySelector('.toast-container');
        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, this.config.toastDuration);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    },

    getToastColor: function(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    },

    // Setup form validations
    setupFormValidations: function() {
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });
    },

    // Form validation logic
    validateForm: function(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

        inputs.forEach(input => {
            this.clearError(input);
            
            if (!input.value.trim()) {
                this.showError(input, 'This field is required');
                isValid = false;
            } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
                this.showError(input, 'Please enter a valid email address');
                isValid = false;
            } else if (input.type === 'password' && input.value.length < 6) {
                this.showError(input, 'Password must be at least 6 characters');
                isValid = false;
            }
        });

        return isValid;
    },

    // Show field error
    showError: function(input, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 4px;
        `;
        errorDiv.textContent = message;

        input.style.borderColor = '#ef4444';
        input.parentNode.appendChild(errorDiv);
    },

    // Clear field error
    clearError: function(input) {
        input.style.borderColor = '';
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    },

    // Email validation
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Setup UI components
    setupUIComponents: function() {
        // Initialize tooltips
        this.initTooltips();
        
        // Initialize loading states
        this.initLoadingStates();
        
        // Initialize file upload previews
        this.initFileUploads();
    },

    // Tooltip initialization
    initTooltips: function() {
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltipText = e.target.getAttribute('data-tooltip');
                this.showTooltip(e.target, tooltipText);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    },

    // Show tooltip
    showTooltip: function(element, text) {
        let tooltip = document.querySelector('.custom-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: #1f2937;
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 0.75rem;
                z-index: 10000;
                white-space: nowrap;
                pointer-events: none;
            `;
            document.body.appendChild(tooltip);
        }

        const rect = element.getBoundingClientRect();
        tooltip.textContent = text;
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
        tooltip.style.left = (rect.left + (rect.width - tooltip.offsetWidth) / 2) + 'px';
        tooltip.style.display = 'block';
    },

    // Hide tooltip
    hideTooltip: function() {
        const tooltip = document.querySelector('.custom-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    },

    // Loading states
    initLoadingStates: function() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-loading]')) {
                this.setLoadingState(e.target, true);
            }
        });
    },

    // Set loading state for button
    setLoadingState: function(button, isLoading) {
        if (isLoading) {
            button.setAttribute('data-original-text', button.textContent);
            button.innerHTML = '<i class="spinner"></i> Loading...';
            button.disabled = true;
        } else {
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.textContent = originalText;
            }
            button.disabled = false;
        }
    },

    // File upload handling
    initFileUploads: function() {
        const fileInputs = document.querySelectorAll('input[type="file"][data-preview]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFilePreview(e.target);
            });
        });
    },

    // Handle file preview
    handleFilePreview: function(input) {
        const file = input.files[0];
        if (!file) return;

        const previewContainer = document.querySelector(input.getAttribute('data-preview'));
        if (!previewContainer) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 4px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.innerHTML = `
                <div style="padding: 10px; background: #f3f4f6; border-radius: 4px;">
                    <strong>${file.name}</strong> (${this.formatFileSize(file.size)})
                </div>
            `;
        }
    },

    // Format file size
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Handle search with debounce
    handleSearch: function(query) {
        // This would typically make an API call
        console.log('Searching for:', query);
        
        // Show loading state
        const searchResults = document.querySelector('[data-search-results]');
        if (searchResults) {
            searchResults.innerHTML = '<div class="loading">Searching...</div>';
            
            // Simulate API call
            setTimeout(() => {
                searchResults.innerHTML = `<div class="search-result">Results for: "${query}"</div>`;
            }, 500);
        }
    },

    // Toggle modal
    toggleModal: function(modalId, show) {
        if (show && modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        } else {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            document.body.style.overflow = '';
        }
    },

    // Switch tabs
    switchTab: function(clickedTab) {
        const tabContainer = clickedTab.closest('.tabs');
        const tabName = clickedTab.getAttribute('data-tab');
        
        // Update active tab
        tabContainer.querySelectorAll('[data-tab]').forEach(tab => {
            tab.classList.remove('active');
        });
        clickedTab.classList.add('active');
        
        // Show corresponding content
        tabContainer.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.querySelector(`[data-tab-content="${tabName}"]`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    },

    // Handle AJAX form submission
    handleAjaxForm: function(form) {
        const formData = new FormData(form);
        const url = form.getAttribute('action') || window.location.href;
        const method = form.getAttribute('method') || 'POST';

        this.setLoadingState(form.querySelector('button[type="submit"]'), true);

        fetch(url, {
            method: method,
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            this.setLoadingState(form.querySelector('button[type="submit"]'), false);
            
            if (data.success) {
                this.showToast(data.message || 'Operation successful', 'success');
                if (form.hasAttribute('data-redirect')) {
                    setTimeout(() => {
                        window.location.href = form.getAttribute('data-redirect');
                    }, 1000);
                } else if (form.hasAttribute('data-reset')) {
                    form.reset();
                }
            } else {
                this.showToast(data.message || 'Operation failed', 'error');
            }
        })
        .catch(error => {
            this.setLoadingState(form.querySelector('button[type="submit"]'), false);
            this.showToast('An error occurred. Please try again.', 'error');
            console.error('Form submission error:', error);
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    EduLMS.init();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .loading {
        text-align: center;
        padding: 20px;
        color: #6b7280;
    }
    
    .search-result {
        padding: 10px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
    }
    
    .modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
    }
`;
document.head.appendChild(style);