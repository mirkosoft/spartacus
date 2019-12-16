import { Component, OnInit } from '@angular/core';
import {
  SelectiveCartService,
  Cart,
  OrderEntry,
  ActiveCartService,
  CmsParagraphComponent,
  CmsService,
} from '@spartacus/core';
import { Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Item } from '../cart-shared/cart-item/cart-item.component';

@Component({
  selector: 'cx-save-for-later',
  templateUrl: './save-for-later.component.html',
})
export class SaveForLaterComponent implements OnInit {
  saveForLater$: Observable<Cart>;
  cart$: Observable<Cart>;
  entries$: Observable<OrderEntry[]>;
  cartLoaded$: Observable<boolean>;
  data$: Observable<CmsParagraphComponent>;

  constructor(
    protected cmsService: CmsService,
    protected cartService: ActiveCartService,
    protected selectiveCartService: SelectiveCartService
  ) {}

  ngOnInit() {
    this.cart$ = this.cartService.getActive();
    this.saveForLater$ = this.selectiveCartService.getCart();
    this.entries$ = this.selectiveCartService
      .getEntries()
      .pipe(filter(entries => entries.length > 0));
    this.cartLoaded$ = combineLatest([
      this.cartService.getLoaded(),
      this.selectiveCartService.getLoaded(),
    ]).pipe(map(([cartLoaded, slfLoaded]) => cartLoaded && slfLoaded));
    this.data$ = this.cmsService.getComponentData(
      'EmptyCartParagraphComponent'
    );
  }

  moveToCart(item: Item) {
    this.selectiveCartService.removeEntry(item);
    this.cartService.addEntry(item.product.code, item.quantity);
  }
}
