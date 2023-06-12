import { binaryToSQL } from './binary'
import { columnRefToSQL } from './column'
import { identifierToSql, hasVal, commonOptionConnector, toUpper } from './util'
import { exprToSQL } from './expr'

function pivotOperatorToSQL(operator) {
  const { as, column, expr, in_expr, type } = operator
  const result = [
    exprToSQL(expr),
    'FOR',
    columnRefToSQL(column),
    binaryToSQL(in_expr),
  ]
  const sql = [`${toUpper(type)}(${result.join(' ')})`]
  if (as) {
    if (as.as !== null && as.alias !== null) {
      // only tibero

      if (as.as) {
        sql.push('AS', identifierToSql(as.alias))
      } else {
        sql.push(identifierToSql(as.alias))
      }
    } else {
      // not tibero
      sql.push('AS', identifierToSql(as))
    }
  }
  return sql.join(' ')
}

function operatorToSQL(operator) {
  if (!operator) return
  const { type } = operator
  switch (type) {
    case 'pivot':
      return pivotOperatorToSQL(operator)
    default:
      return ''
  }
}

function tableToSQL(tableInfo) {
  const { table, db, as, expr, operator } = tableInfo
  const database = identifierToSql(db)
  const tableName = table ? identifierToSql(table) : exprToSQL(expr)
  const str = [database, tableName].filter(hasVal).join('.')
  const result = [str, operatorToSQL(operator)]
  if (as) result.push('AS', identifierToSql(as))
  return result.filter(hasVal).join(' ')
}

function unnestToSQL(unnestExpr) {
  const { type, as, expr, with_offset: withOffset } = unnestExpr
  const result = [toUpper(type), `(${expr && exprToSQL(expr) || ' '})`, commonOptionConnector('AS', identifierToSql, as), commonOptionConnector(toUpper(withOffset && withOffset.keyword), identifierToSql, withOffset && withOffset.as)]
  return result.filter(hasVal).join(' ')
}

/**
 * @param {Array} tables
 * @return {string}
 */
function tablesToSQL(tables) {
  const { type } = tables
  if (toUpper(type) === 'UNNEST') return unnestToSQL(tables)
  const baseTable = tables[0]
  const clauses = []
  if (baseTable.type === 'dual') return 'DUAL'
  clauses.push(tableToSQL(baseTable))
  for (let i = 1; i < tables.length; ++i) {
    const joinExpr = tables[i]
    const { on, using, join } = joinExpr
    const str = []
    str.push(join ? ` ${join}` : ',')
    str.push(tableToSQL(joinExpr))
    str.push(commonOptionConnector('ON', exprToSQL, on))
    if (using) str.push(`USING (${using.map(identifierToSql).join(', ')})`)
    clauses.push(str.filter(hasVal).join(' '))
  }
  return clauses.filter(hasVal).join('')
}

function tableOptionToSQL(tableOption) {
  const { keyword, symbol, value } = tableOption
  const sql = [keyword.toUpperCase()]
  if (symbol) sql.push(symbol)
  sql.push(value)
  return sql.join(' ')
}

export {
  operatorToSQL,
  tablesToSQL,
  tableOptionToSQL,
  tableToSQL,
  unnestToSQL,
}
