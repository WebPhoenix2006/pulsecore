import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { InventoryRoutingModule } from './inventory-routing-module';
import { Skus } from './components/skus/skus';
import { Alerts } from './components/alerts/alerts';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';
import { Layout } from '../shared/components/layout/layout';

@NgModule({
  declarations: [Skus, Alerts],
  imports: [CommonModule, InventoryRoutingModule, SharedModule, ReactiveFormsModule, Layout],
})
export class InventoryModule {}
