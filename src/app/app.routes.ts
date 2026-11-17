import { Routes } from '@angular/router';
import { Gate } from './gate/gate';
import { driverGuard, entityGuard, loaderGuard, orderGuard, portalGuard } from './guards';
import { HomeRedirect } from './home-redirect';
import { CartsPage } from './pages/carts/carts';
import { DeskPage } from './pages/desk/desk';
import { DeskEditPage } from './pages/desk/edit';
import { DrivePage } from './pages/drive/drive';
import { OpenCart } from './pages/open/open';
import { Shell } from './shell/shell';

export const routes: Routes = [
  { path: '', component: Gate },
  {
    path: 'home',
    component: Shell,
    canActivate: [portalGuard],
    children: [
      { path: '', pathMatch: 'full', component: HomeRedirect },
      { path: 'carts', component: CartsPage, canActivate: [entityGuard] },
      { path: 'carts/:id', component: OpenCart, canActivate: [orderGuard] },
      { path: 'desk', component: DeskPage, canActivate: [loaderGuard] },
      { path: 'desk/:id', component: DeskEditPage, canActivate: [loaderGuard] },
      { path: 'drive', component: DrivePage, canActivate: [driverGuard] },
    ],
  },
  { path: '**', redirectTo: '' },
];
