describe('User Login Flow', () => {
    it('logs in and redirects to the dashboard', () => {
      cy.visit('http://localhost:3000'); // Adjust URL as needed
      cy.get('input[type="email"]').type('123@gmail.com');
      cy.get('input[type="password"]').type('12345678@ab');
      cy.contains('Sign In').click();
    });
  });
  