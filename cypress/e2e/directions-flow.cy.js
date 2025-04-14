describe('Google Maps Directions Embed', () => {
    it('loads directions when "Get Directions" is clicked', () => {
      cy.visit('http://localhost:3000/search-parking');
      // Simulate a search. Adjust input selectors as per your implementation.
      cy.get('input[placeholder*="Search"]').type('Admin{enter}');
      cy.wait(500);
      // Simulate clicking on Get Directions button
      cy.contains('Get Directions').click();
      // Confirm that an iframe with Google Maps is loaded
      cy.get('iframe[src*="google.com/maps/embed"]').should('exist');
    });
  });
  