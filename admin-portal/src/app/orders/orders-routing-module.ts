import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Layout } from '../shared/components/layout/layout';
import { Orders } from './components/orders/orders';
import { Payments } from './components/payments/payments';

const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: Orders },
      { path: 'payments', component: Payments },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdersRoutingModule {}
