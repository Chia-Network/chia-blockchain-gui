import { type ParamSchema } from './Commands';
import { humanizeParamValue } from './humanizeParamValue';

export async function humanizeParams(params: ParamSchema[], data: Record<string, unknown>, networkPrefix?: string) {
  // hidden and optional params that are not presented are not shown in the confirm dialog
  const visibleParams = params.filter((param) => {
    const { hide, isOptional, name } = param;

    if (hide === true) {
      return false;
    }

    const isDefined = name in data;
    if (isOptional && !isDefined) {
      return false;
    }

    return true;
  });

  // humanize the visible params
  const humanizedParams = await Promise.all(
    visibleParams.map(async (param) => {
      const value = data[param.name];

      const humanizedValue = await humanizeParamValue(param, value, data, networkPrefix);

      return {
        field: param.name,
        label: param.label(),
        value: humanizedValue,
      };
    }),
  );

  return humanizedParams;
}
