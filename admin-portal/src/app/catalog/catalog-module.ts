import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CatalogRoutingModule } from './catalog-routing-module';
import { Category } from './components/category/category';
import { Products } from './components/products/products';


@NgModule({
  declarations: [
    Category,
    Products
  ],
  imports: [
    CommonModule,
    CatalogRoutingModule
  ]
})
export class CatalogModule { }
