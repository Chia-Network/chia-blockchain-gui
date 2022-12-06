// deprecated
import Unit from '../constants/Unit';
import UnitAliases from '../constants/UnitAliases';
import UnitValue from '../constants/UnitValue';

function getUnitNameByAlias(unitName: string): Unit {
  const name = unitName.toLowerCase();

  const alias = Object.keys(UnitAliases).find((key) => !!UnitAliases[key]?.includes(name));
  if (alias === undefined) {
    throw new Error(`Unit '${unitName}' is not supported`);
  }

  return alias as Unit;
}

function getUnitName(unitName: string): Unit {
  const name = unitName.toLowerCase();

  if (name in Unit) {
    return name as Unit;
  }

  return getUnitNameByAlias(unitName);
}

export default function getUnitValue(unitName: string): number {
  return UnitValue[getUnitName(unitName)];
}
