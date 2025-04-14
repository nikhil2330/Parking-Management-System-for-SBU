describe('Google Maps Directions Embed', () => {
  it('logs in, searches for SAC, then loads directions iframe when "Get Directions" is clicked', () => {
    // Step 1: Visit the sign-in page and log in
    cy.visit('http://localhost:3000/signin');
    cy.get('input[type="email"]').type('123@gmail.com');
    cy.get('input[type="password"]').type('12345678@ab');
    cy.contains('Sign In').click();
    
    // Wait until redirected to home (check URL includes '/home')
    cy.url().should('include', '/home');
    
    // Step 2: Navigate to the search-parking page
    cy.visit('http://localhost:3000/search-parking');
    
    // Step 3: Wait for search input, type "SAC", wait 50ms then simulate the Enter key
    cy.get('input[placeholder*="Search"]', { timeout: 10000 })
      .should('be.visible')
      .type('SAC');
    cy.wait(100);
    cy.get('input[placeholder*="Search"]').type('{enter}');
    
    // Step 4: Wait for 5 seconds for the search results to load
    cy.wait(5000);
    
    // Step 5: Click on "Get Directions" and verify that an iframe with Google Maps embed is present.
    cy.contains('Get Directions', { timeout: 10000 })
      .should('be.visible')
      .click();
    
    cy.get('iframe[src*="google.com/maps/embed"]', { timeout: 10000 })
      .should('exist');
  });
});
