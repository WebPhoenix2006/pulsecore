import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CatalogRoutingModule } from './catalog-routing-module';
import { Category } from './components/category/category';
import { Products } from './components/products/products';
import { SharedModule } from '../shared/shared-module';
import { Layout } from './components/layout/layout';

@NgModule({
  declarations: [Category, Products, Layout],
  imports: [CommonModule, CatalogRoutingModule, SharedModule],
})
export class CatalogModule {}
