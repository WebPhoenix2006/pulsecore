import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RestaurantsRoutingModule } from './restaurants-routing-module';
import { Layout } from './layout/layout';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [Layout],
  imports: [CommonModule, SharedModule, RouterModule, RestaurantsRoutingModule],
})
export class RestaurantsModule {}
