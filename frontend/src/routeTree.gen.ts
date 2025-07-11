/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as SignupImport } from './routes/signup'
import { Route as ResetPasswordImport } from './routes/reset-password'
import { Route as RecoverPasswordImport } from './routes/recover-password'
import { Route as LoginImport } from './routes/login'
import { Route as LayoutImport } from './routes/_layout'
import { Route as LayoutIndexImport } from './routes/_layout/index'
import { Route as LayoutUserroleImport } from './routes/_layout/userrole'
import { Route as LayoutSubcategoryImport } from './routes/_layout/subcategory'
import { Route as LayoutSettingsImport } from './routes/_layout/settings'
import { Route as LayoutRolesclaimsImport } from './routes/_layout/rolesclaims'
import { Route as LayoutRolesImport } from './routes/_layout/roles'
import { Route as LayoutLocationImport } from './routes/_layout/location'
import { Route as LayoutItemsImport } from './routes/_layout/items'
import { Route as LayoutCoursesImport } from './routes/_layout/courses'
import { Route as LayoutCategoryImport } from './routes/_layout/category'
import { Route as LayoutAdminImport } from './routes/_layout/admin'

// Create/Update Routes

const SignupRoute = SignupImport.update({
  path: '/signup',
  getParentRoute: () => rootRoute,
} as any)

const ResetPasswordRoute = ResetPasswordImport.update({
  path: '/reset-password',
  getParentRoute: () => rootRoute,
} as any)

const RecoverPasswordRoute = RecoverPasswordImport.update({
  path: '/recover-password',
  getParentRoute: () => rootRoute,
} as any)

const LoginRoute = LoginImport.update({
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const LayoutRoute = LayoutImport.update({
  id: '/_layout',
  getParentRoute: () => rootRoute,
} as any)

const LayoutIndexRoute = LayoutIndexImport.update({
  path: '/',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutUserroleRoute = LayoutUserroleImport.update({
  path: '/userrole',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutSubcategoryRoute = LayoutSubcategoryImport.update({
  path: '/subcategory',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutSettingsRoute = LayoutSettingsImport.update({
  path: '/settings',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutRolesclaimsRoute = LayoutRolesclaimsImport.update({
  path: '/rolesclaims',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutRolesRoute = LayoutRolesImport.update({
  path: '/roles',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutLocationRoute = LayoutLocationImport.update({
  path: '/location',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutItemsRoute = LayoutItemsImport.update({
  path: '/items',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutCoursesRoute = LayoutCoursesImport.update({
  path: '/courses',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutCategoryRoute = LayoutCategoryImport.update({
  path: '/category',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutAdminRoute = LayoutAdminImport.update({
  path: '/admin',
  getParentRoute: () => LayoutRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_layout': {
      preLoaderRoute: typeof LayoutImport
      parentRoute: typeof rootRoute
    }
    '/login': {
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/recover-password': {
      preLoaderRoute: typeof RecoverPasswordImport
      parentRoute: typeof rootRoute
    }
    '/reset-password': {
      preLoaderRoute: typeof ResetPasswordImport
      parentRoute: typeof rootRoute
    }
    '/signup': {
      preLoaderRoute: typeof SignupImport
      parentRoute: typeof rootRoute
    }
    '/_layout/admin': {
      preLoaderRoute: typeof LayoutAdminImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/category': {
      preLoaderRoute: typeof LayoutCategoryImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/courses': {
      preLoaderRoute: typeof LayoutCoursesImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/items': {
      preLoaderRoute: typeof LayoutItemsImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/location': {
      preLoaderRoute: typeof LayoutLocationImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/roles': {
      preLoaderRoute: typeof LayoutRolesImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/rolesclaims': {
      preLoaderRoute: typeof LayoutRolesclaimsImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/settings': {
      preLoaderRoute: typeof LayoutSettingsImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/subcategory': {
      preLoaderRoute: typeof LayoutSubcategoryImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/userrole': {
      preLoaderRoute: typeof LayoutUserroleImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/': {
      preLoaderRoute: typeof LayoutIndexImport
      parentRoute: typeof LayoutImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  LayoutRoute.addChildren([
    LayoutAdminRoute,
    LayoutCategoryRoute,
    LayoutCoursesRoute,
    LayoutItemsRoute,
    LayoutLocationRoute,
    LayoutRolesRoute,
    LayoutRolesclaimsRoute,
    LayoutSettingsRoute,
    LayoutSubcategoryRoute,
    LayoutUserroleRoute,
    LayoutIndexRoute,
  ]),
  LoginRoute,
  RecoverPasswordRoute,
  ResetPasswordRoute,
  SignupRoute,
])

/* prettier-ignore-end */
