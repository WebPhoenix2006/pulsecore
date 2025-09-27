import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CatalogRoutingModule } from './catalog-routing-module';
import { Category } from './components/category/category';
import { Products } from './components/products/products';
import { SharedModule } from '../shared/shared-module';
import { ReactiveFormsModule } from '@angular/forms';
import { Layout } from '../shared/components/layout/layout';

@NgModule({
  declarations: [Category, Products],
  imports: [CommonModule, CatalogRoutingModule, SharedModule, ReactiveFormsModule, Layout],
})
export class CatalogModule {}
