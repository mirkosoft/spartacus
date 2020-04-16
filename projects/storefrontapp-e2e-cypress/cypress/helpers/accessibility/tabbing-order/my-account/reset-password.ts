import { verifyTabbingOrder } from '../../tabbing-order';
import { TabElement } from '../../tabbing-order.model';

const containerSelector = '.LoginPageTemplate';

export function forgotPasswordTabbingOrder(config: TabElement[]) {
  cy.server();
  cy.route(`${Cypress.env('BASE_ENDPOINT')}/cms/components*`).as(
    'getComponents'
  );
  cy.visit('/login/forgot-password');
  cy.wait('@getComponents');

  verifyTabbingOrder(containerSelector, config);
}
