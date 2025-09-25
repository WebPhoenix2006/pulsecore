import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Category } from '../catalog/components/category/category';
import { Products } from '../catalog/components/products/products';
import { Layout } from './layout/layout';
import { Skus } from './components/skus/skus';
import { Alerts } from './components/alerts/alerts';

const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'skus', component: Skus },

      { path: 'alerts', component: Alerts },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventoryRoutingModule {}
