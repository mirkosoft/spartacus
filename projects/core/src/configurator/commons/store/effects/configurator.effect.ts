import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { catchError, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { Configurator } from '../../../../model/configurator.model';
import { makeErrorSerializable } from '../../../../util/serialization-utils';
import { ConfiguratorCommonsConnector } from '../../connectors/configurator-commons.connector';
import * as ConfiguratorSelectors from '../../store/selectors/configurator.selector';
import {
  CreateConfiguration,
  CreateConfigurationFail,
  CreateConfigurationSuccess,
  CREATE_CONFIGURATION,
  ReadConfiguration,
  ReadConfigurationFail,
  ReadConfigurationSuccess,
  READ_CONFIGURATION,
  UpdateConfiguration,
  UpdateConfigurationChangesPending,
  UpdateConfigurationFail,
  UpdateConfigurationFinalize,
  UpdateConfigurationSuccess,
  UPDATE_CONFIGURATION,
  UPDATE_CONFIGURATION_SUCCESS,
} from '../actions/configurator.action';
import { StateWithConfiguration } from '../configuration-state';

@Injectable()
export class ConfiguratorEffects {
  @Effect()
  createConfiguration$: Observable<
    CreateConfiguration | CreateConfigurationSuccess | CreateConfigurationFail
  > = this.actions$.pipe(
    ofType(CREATE_CONFIGURATION),
    map((action: { type: string; productCode?: string }) => action.productCode),
    mergeMap(productCode => {
      return this.configuratorCommonsConnector
        .createConfiguration(productCode)
        .pipe(
          switchMap((configuration: Configurator.Configuration) => {
            return [new CreateConfigurationSuccess(configuration)];
          }),
          catchError(error => [
            new CreateConfigurationFail(
              productCode,
              makeErrorSerializable(error)
            ),
          ])
        );
    })
  );

  @Effect()
  readConfiguration$: Observable<
    ReadConfiguration | ReadConfigurationSuccess | ReadConfigurationFail
  > = this.actions$.pipe(
    ofType(READ_CONFIGURATION),
    map(
      (action: {
        type: string;
        payload?: { configId: string; productCode: string };
      }) => action.payload
    ),
    mergeMap(payload => {
      return this.configuratorCommonsConnector
        .readConfiguration(payload.configId)
        .pipe(
          switchMap((configuration: Configurator.Configuration) => {
            return [new ReadConfigurationSuccess(configuration)];
          }),
          catchError(error => [
            new ReadConfigurationFail(
              payload.productCode,
              makeErrorSerializable(error)
            ),
          ])
        );
    })
  );

  @Effect()
  updateConfiguration$: Observable<
    UpdateConfiguration | UpdateConfigurationSuccess | UpdateConfigurationFail
  > = this.actions$.pipe(
    ofType(UPDATE_CONFIGURATION),
    map(
      (action: { type: string; payload?: Configurator.Configuration }) =>
        action.payload
    ),
    //mergeMap here as we need to process each update
    //(which only sends one changed attribute at a time),
    //so we must not cancel inner emissions
    mergeMap(payload => {
      return this.configuratorCommonsConnector
        .updateConfiguration(payload)
        .pipe(
          map((configuration: Configurator.Configuration) => {
            return new UpdateConfigurationSuccess(configuration);
          }),
          catchError(error => {
            return [
              new UpdateConfigurationFail(
                payload.productCode,
                makeErrorSerializable(error)
              ),
            ];
          })
        );
    })
  );

  @Effect()
  checkUpdateNeeded$: Observable<
    UpdateConfigurationFinalize | UpdateConfigurationChangesPending
  > = this.actions$.pipe(
    ofType(UPDATE_CONFIGURATION_SUCCESS),
    map(
      (action: { type: string; payload?: Configurator.Configuration }) =>
        action.payload
    ),
    mergeMap(payload => {
      return this.store.pipe(
        select(ConfiguratorSelectors.getPendingChanges),
        take(1),
        map(pendingChanges => {
          if (pendingChanges === 0) {
            return new UpdateConfigurationFinalize(payload);
          } else {
            return new UpdateConfigurationChangesPending();
          }
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private configuratorCommonsConnector: ConfiguratorCommonsConnector,
    private store: Store<StateWithConfiguration>
  ) {}
}
