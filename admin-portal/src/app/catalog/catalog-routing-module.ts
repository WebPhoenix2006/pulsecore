import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Category } from './components/category/category';
import { Layout } from './components/layout/layout';
import { Products } from './components/products/products';

const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'categories', component: Category },

      { path: 'products', component: Products },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CatalogRoutingModule {}
