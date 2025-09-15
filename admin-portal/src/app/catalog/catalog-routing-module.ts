import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Category } from './components/category/category';

const routes: Routes = [{ path: 'category', component: Category }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CatalogRoutingModule {}
