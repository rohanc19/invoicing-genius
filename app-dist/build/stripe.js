/**
 * Mock Stripe.js for Invoicing Genius
 * This provides a mock implementation of the Stripe API for offline use
 */
(function(window) {
  console.log('Mock Stripe.js loaded');
  
  // Create a mock Stripe object
  const mockStripe = function(publishableKey, options) {
    console.log('Mock Stripe initialized with key:', publishableKey);
    
    return {
      elements: function(options) {
        console.log('Mock Stripe.elements() called with options:', options);
        
        return {
          create: function(type, options) {
            console.log('Mock Stripe element created:', type, options);
            
            return {
              mount: function(selector) {
                console.log('Mock Stripe element mounted to:', selector);
                
                // Find the element and add a mock input
                setTimeout(() => {
                  const el = document.querySelector(selector);
                  if (el) {
                    el.innerHTML = `<div class="mock-stripe-element">
                      <input type="text" placeholder="Mock ${type} element" 
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>`;
                  }
                }, 100);
                
                return this;
              },
              on: function(event, handler) {
                console.log('Mock Stripe element event listener added:', event);
                return this;
              },
              update: function(options) {
                console.log('Mock Stripe element updated with options:', options);
                return this;
              },
              destroy: function() {
                console.log('Mock Stripe element destroyed');
              }
            };
          }
        };
      },
      createToken: function(element, data) {
        console.log('Mock Stripe.createToken() called with data:', data);
        
        return Promise.resolve({
          token: {
            id: 'mock_token_' + Math.random().toString(36).substring(2),
            object: 'token',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025
            }
          }
        });
      },
      createPaymentMethod: function(type, element, data) {
        console.log('Mock Stripe.createPaymentMethod() called with type:', type, 'and data:', data);
        
        return Promise.resolve({
          paymentMethod: {
            id: 'mock_pm_' + Math.random().toString(36).substring(2),
            object: 'payment_method',
            type: type,
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025
            }
          }
        });
      },
      confirmCardPayment: function(clientSecret, data) {
        console.log('Mock Stripe.confirmCardPayment() called with clientSecret:', clientSecret, 'and data:', data);
        
        return Promise.resolve({
          paymentIntent: {
            id: 'mock_pi_' + Math.random().toString(36).substring(2),
            object: 'payment_intent',
            amount: 2000,
            currency: 'usd',
            status: 'succeeded'
          }
        });
      },
      retrievePaymentIntent: function(clientSecret) {
        console.log('Mock Stripe.retrievePaymentIntent() called with clientSecret:', clientSecret);
        
        return Promise.resolve({
          paymentIntent: {
            id: 'mock_pi_' + Math.random().toString(36).substring(2),
            object: 'payment_intent',
            amount: 2000,
            currency: 'usd',
            status: 'succeeded'
          }
        });
      }
    };
  };
  
  // Add version and other properties
  mockStripe.version = '3.0.0';
  
  // Expose to window
  window.Stripe = mockStripe;
  
  // Dispatch a load event to notify the app that Stripe is ready
  const event = new Event('stripe-loaded');
  window.dispatchEvent(event);
  
  console.log('Mock Stripe.js fully initialized');
})(window);
