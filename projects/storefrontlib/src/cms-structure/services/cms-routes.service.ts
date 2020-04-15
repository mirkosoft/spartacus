import { Injectable } from '@angular/core';
import { CmsComponentMapping, PageContext } from '@spartacus/core';
import { CmsRoutesImplService } from './cms-routes-impl.service';

// Public injection token for the private implementation of the service `CmsRoutesImplService`.
// After #7070, this class should be replaced with a real implementation.
@Injectable({
  providedIn: 'root',
  useExisting: CmsRoutesImplService,
})
export abstract class CmsRoutesService {
  abstract handleCmsRoutesInGuard(
    pageContext: PageContext,
    componentMappings: CmsComponentMapping[],
    currentUrl: string,
    currentPageLabel: string
  ): boolean;
}
