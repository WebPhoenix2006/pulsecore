import { ChangeDetectorRef, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideCharts, withDefaultRegisterables, BaseChartDirective } from 'ng2-charts';

import { AnalyticsRoutingModule } from './analytics-routing-module';
import { Layout } from '../shared/components/layout/layout';
import { SharedModule } from '../shared/shared-module';

// Components
import { Dashboard } from './components/dashboard/dashboard';
import { Sales } from './components/sales/sales';
import { Stock } from './components/stock/stock';
import { Stockouts } from './components/stockouts/stockouts';

// Services
import { AnalyticsService } from './services/analytics.service';

@NgModule({
  declarations: [Dashboard, Sales, Stock, Stockouts],
  imports: [
    CommonModule,
    FormsModule,
    AnalyticsRoutingModule,
    Layout,
    SharedModule,
    BaseChartDirective,
  ],
  providers: [AnalyticsService, provideCharts(withDefaultRegisterables())],
})
export class AnalyticsModule {}
