import { verifyTabbingOrder } from '../../tabbing-order';
import { TabElement } from '../../tabbing-order.model';

const containerSelector = '.StoreFinderPageTemplate';

export function countriesListTabbingOrder(config: TabElement[]) {
  cy.visit('/store-finder/view-all');

  cy.server();

  cy.route(
    'GET',
    `${Cypress.env('PREFIX_AND_BASESITE')}/stores/storescounts*`
  ).as('storesCounts');

  cy.wait('@storesCounts');
  verifyTabbingOrder(containerSelector, config);
}
