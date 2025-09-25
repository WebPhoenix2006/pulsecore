import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoryRoutingModule } from './inventory-routing-module';
import { Skus } from './components/skus/skus';
import { Alerts } from './components/alerts/alerts';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';
import { Layout } from './layout/layout';

@NgModule({
  declarations: [Skus, Alerts, Layout],
  imports: [CommonModule, InventoryRoutingModule, SharedModule],
})
export class InventoryModule {}
