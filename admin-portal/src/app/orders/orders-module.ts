import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { OrdersRoutingModule } from './orders-routing-module';
import { Layout } from '../shared/components/layout/layout';

// Components
import { Orders } from './components/orders/orders';
import { Payments } from './components/payments/payments';
import { CreateOrderModalComponent } from './components/create-order-modal/create-order-modal.component';
import { OrderDetailsComponent } from './components/order-details/order-details.component';
import { ReturnModalComponent } from './components/return-modal/return-modal.component';
import { SharedModule } from '../shared/shared-module';

@NgModule({
  declarations: [
    Orders,
    Payments,
    CreateOrderModalComponent,
    OrderDetailsComponent,
    ReturnModalComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    OrdersRoutingModule,
    Layout,
    SharedModule,
  ],
})
export class OrdersModule {}
