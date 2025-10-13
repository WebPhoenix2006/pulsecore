import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Layout } from '../shared/components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { Sales } from './components/sales/sales';
import { Stock } from './components/stock/stock';
import { Stockouts } from './components/stockouts/stockouts';

const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'sales', component: Sales },
      { path: 'stock', component: Stock },
      { path: 'stockouts', component: Stockouts },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnalyticsRoutingModule {}
