const { expect } = require('chai')
const Parser = require('../src/parser').default

describe('Postgres', () => {
  const parser = new Parser();
  const opt = {
    database: 'postgresql'
  }

  function getParsedSql(sql, opt) {
      const ast = parser.astify(sql, opt);
      return parser.sqlify(ast, opt);
  }

  const SQL_LIST = [
    {
      title: 'select with_query_name',
      sql: [
        `WITH
        subQ1 AS (SELECT * FROM Roster WHERE SchoolID = 52),
        subQ2 AS (SELECT SchoolID FROM subQ1)
      SELECT DISTINCT * FROM subQ2;`,
      `WITH subQ1 AS (SELECT * FROM "Roster" WHERE "SchoolID" = 52), subQ2 AS (SELECT "SchoolID" FROM "subQ1") SELECT DISTINCT * FROM "subQ2"`
    ]
    },
    {
      title: 'select subquery',
      sql: [
        `SELECT AVG ( PointsScored )
        FROM
        ( SELECT PointsScored
          FROM Stats
          WHERE SchoolID = 77 )`,
        'SELECT AVG("PointsScored") FROM (SELECT "PointsScored" FROM "Stats" WHERE "SchoolID" = 77)'
      ]
    },
    {
      title: 'select subquery have alias',
      sql: [
        `SELECT r.LastName
        FROM
        ( SELECT * FROM Roster) AS r`,
        'SELECT "r"."LastName" FROM (SELECT * FROM "Roster") AS "r"'
      ]
    },
    {
      title: 'select implicit "comma cross join"',
      sql: [
        'SELECT * FROM Roster, TeamMascot',
        'SELECT * FROM "Roster", "TeamMascot"'
      ]
    },
    {
      title: 'select inner join using',
      sql: [
        `SELECT FirstName
        FROM Roster INNER JOIN PlayerStats
        USING (LastName);`,
        'SELECT "FirstName" FROM "Roster" INNER JOIN "PlayerStats" USING ("LastName")'
      ]
    },
    {
        title: 'Window Fns with qualified frame clause',
        sql: [
          `SELECT
            first_name,
            SUM(user_age) OVER (PARTITION BY user_city ORDER BY created_at DESC) AS age_window
          FROM roster`,
          'SELECT "first_name", SUM("user_age") OVER (PARTITION BY "user_city" ORDER BY "created_at" DESC) AS "age_window" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns',
        sql: [
          `SELECT
            first_name,
            SUM(user_age) OVER (PARTITION BY user_city ORDER BY created_at) AS age_window
          FROM roster`,
          'SELECT "first_name", SUM("user_age") OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC) AS "age_window" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns + ROWS following',
        sql: [
          `SELECT
            first_name,
            SUM(user_age) OVER (
                PARTITION BY user_city
                ORDER BY created_at ASC
                ROWS 1 FOLLOWING
            ) AS age_window
          FROM roster`,
          'SELECT "first_name", SUM("user_age") OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC ROWS 1 FOLLOWING) AS "age_window" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns + ROWS unbounded following',
        sql: [
          `SELECT
            first_name,
            SUM(user_age) OVER (
                PARTITION BY user_city
                ORDER BY created_at ASC
                ROWS UNbounded FOLLOWING
            ) AS age_window
          FROM roster`,
          'SELECT "first_name", SUM("user_age") OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC ROWS UNBOUNDED FOLLOWING) AS "age_window" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns + ROWS unbounded preceding',
        sql: [
          `SELECT
            first_name,
            SUM(user_age) OVER (
                PARTITION BY user_city
                ORDER BY created_at ASC
                ROWS UNbounded preceding
            ) AS age_window
          FROM roster`,
          'SELECT "first_name", SUM("user_age") OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC ROWS UNBOUNDED PRECEDING) AS "age_window" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns + ROWS between',
        sql: [
          `SELECT
            first_name,
            SUM(user_age) OVER (
                PARTITION BY user_city
                ORDER BY created_at DESC
                ROWS BETWEEN 1 preceding AND 5 FOLLOWING
            ) AS age_window,
            SUM(user_age) OVER (
                PARTITION BY user_city
                ORDER BY created_at DESC
                ROWS BETWEEN unbounded preceding AND unbounded following
            ) AS age_window2
          FROM roster`,
          'SELECT "first_name", SUM("user_age") OVER (PARTITION BY "user_city" ORDER BY "created_at" DESC ROWS BETWEEN 1 PRECEDING AND 5 FOLLOWING) AS "age_window", SUM("user_age") OVER (PARTITION BY "user_city" ORDER BY "created_at" DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS "age_window2" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns + ROWS unbounded preceding + current row',
        sql: [
          `SELECT
            first_name,
            SUM(user_age) OVER (
                PARTITION BY user_city
                ORDER BY created_at, user_id ASC
                ROWS BETWEEN UNbounded preceding AND CURRENT ROW
            ) AS age_window
          FROM roster`,
          'SELECT "first_name", SUM("user_age") OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC, "user_id" ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "age_window" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns + RANKING',
        sql: [
          `SELECT
            ROW_NUMBER() OVER (
                PARTITION BY user_city
                ORDER BY created_at
            ) AS age_window
          FROM roster`,
          'SELECT ROW_NUMBER() OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC) AS "age_window" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns + DENSE_RANK w/ empty OVER',
        sql: [
          `SELECT
            DENSE_RANK() OVER () AS age_window
          FROM roster`,
          'SELECT DENSE_RANK() OVER () AS "age_window" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns + LAG',
        sql: [
          `SELECT
            LAG(user_name, 10) OVER (
                PARTITION BY user_city
                ORDER BY created_at
            ) AS age_window
          FROM roster`,
          'SELECT LAG("user_name", 10) RESPECT NULLS OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC) AS "age_window" FROM "roster"'
        ]
    },
    {
      title: 'Window Fns + LEAD',
      sql: [
        `SELECT
          LEAD(user_name, 10) OVER (
              PARTITION BY user_city
              ORDER BY created_at
          ) AS age_window
        FROM roster`,
        'SELECT LEAD("user_name", 10) RESPECT NULLS OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC) AS "age_window" FROM "roster"'
      ]
    },
    {
      title: 'Window Fns + NTH_VALUE',
      sql: [
        `SELECT
        NTH_VALUE(user_name, 10) OVER (
              PARTITION BY user_city
              ORDER BY created_at
          ) AS age_window
        FROM roster`,
        'SELECT NTH_VALUE("user_name", 10) RESPECT NULLS OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC) AS "age_window" FROM "roster"'
      ]
    },
    {
        title: 'Window Fns + LAG + explicit NULLS',
        sql: [
          `SELECT
            LAG(user_name) ignore NULLS OVER (
                PARTITION BY user_city
                ORDER BY created_at
            ) AS age_window
          FROM roster`,
          'SELECT LAG("user_name") IGNORE NULLS OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC) AS "age_window" FROM "roster"'
        ]
    },
    {
        title: 'Window Fns + FIRST_VALUE',
        sql: [
          `SELECT
            FIRST_VALUE(user_name ignore NULLS) OVER (
                PARTITION BY user_city
                ORDER BY created_at, ranking
            ) AS age_window
          FROM roster`,
          'SELECT FIRST_VALUE("user_name" IGNORE NULLS) OVER (PARTITION BY "user_city" ORDER BY "created_at" ASC, "ranking" ASC) AS "age_window" FROM "roster"'
        ]
    },
    {
      title: 'array column',
      sql: [
        "SELECT ARRAY[col1, col2, 1, 'str_literal'] from tableb",
        `SELECT ARRAY["col1","col2",1,'str_literal'] FROM "tableb"`
      ]
    },
    {
      title: 'row function column',
      sql: [
        "SELECT ROW(col1, col2, 'literal', 1) from tableb",
        `SELECT ROW("col1", "col2", 'literal', 1) FROM "tableb"`
      ]
    },
    {
      title: 'json column',
      sql: [
        `SELECT
        d.metadata->>'communication_status' as communication_status
      FROM
        device d
      WHERE d.metadata->>'communication_status' IS NOT NULL
      LIMIT 10;`,
        `SELECT "d"."metadata" ->> 'communication_status' AS "communication_status" FROM "device" AS "d" WHERE "d"."metadata" ->> 'communication_status' IS NOT NULL LIMIT 10`
      ]
    },
    {
      title: 'case when in pg',
      sql: [
        `SELECT SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) FROM tablename`,
        `SELECT SUM(CASE WHEN "status" = 'ACTIVE' THEN 1 ELSE 0 END) FROM "tablename"`
      ]
    },
    {
      title: 'key keyword in pg',
      sql: [
        `SELECT * FROM partitions WHERE location IS NULL AND code like 'XX-%' AND key <> 1;`,
        `SELECT * FROM "partitions" WHERE "location" IS NULL AND "code" LIKE 'XX-%' AND "key" <> 1`
      ]
    },
  ]
  function neatlyNestTestedSQL(sqlList){
    sqlList.forEach(sqlInfo => {
        const {title, sql} = sqlInfo
        it(`should support ${title}`, () => {
          expect(getParsedSql(sql[0], opt)).to.equal(sql[1])
        })
    })
  }
  neatlyNestTestedSQL(SQL_LIST)

  describe('create sequence', () => {
    const SQL_LIST = [
      {
        title: 'create sequence',
        sql: [
          `CREATE SEQUENCE public.table_id_seq`,
          'CREATE SEQUENCE "public"."table_id_seq"'
        ]
      },
      {
        title: 'create sequence increment by',
        sql: [
          `CREATE TEMPORARY SEQUENCE if not exists public.table_id_seq increment by 10`,
          'CREATE TEMPORARY SEQUENCE IF NOT EXISTS "public"."table_id_seq" INCREMENT BY 10'
        ]
      },
      {
        title: 'create sequence increment by minvalue and maxvalue',
        sql: [
          `CREATE TEMPORARY SEQUENCE if not exists public.table_id_seq increment by 10 minvalue 20 maxvalue 30`,
          'CREATE TEMPORARY SEQUENCE IF NOT EXISTS "public"."table_id_seq" INCREMENT BY 10 MINVALUE 20 MAXVALUE 30'
        ]
      },
      {
        title: 'create sequence increment by start with cache',
        sql: [
          `CREATE TEMPORARY SEQUENCE if not exists public.table_id_seq increment by 10 no minvalue no maxvalue start with 1 cache 3`,
          'CREATE TEMPORARY SEQUENCE IF NOT EXISTS "public"."table_id_seq" INCREMENT BY 10 NO MINVALUE NO MAXVALUE START WITH 1 CACHE 3'
        ]
      },
      {
        title: 'create sequence increment by start with cache, cycle and owned',
        sql: [
          `CREATE TEMPORARY SEQUENCE if not exists public.table_id_seq increment by 10 no minvalue no maxvalue start with 1 cache 3 no cycle owned by tn.cn`,
          'CREATE TEMPORARY SEQUENCE IF NOT EXISTS "public"."table_id_seq" INCREMENT BY 10 NO MINVALUE NO MAXVALUE START WITH 1 CACHE 3 NO CYCLE OWNED BY "tn"."cn"'
        ]
      },
      {
        title: 'create sequence increment by start with cache, cycle and owned',
        sql: [
          `CREATE TEMPORARY SEQUENCE if not exists public.table_id_seq increment 10 no minvalue no maxvalue start with 1 cache 3 cycle owned by none`,
          'CREATE TEMPORARY SEQUENCE IF NOT EXISTS "public"."table_id_seq" INCREMENT 10 NO MINVALUE NO MAXVALUE START WITH 1 CACHE 3 CYCLE OWNED BY NONE'
        ]
      },
    ]
    neatlyNestTestedSQL(SQL_LIST)
  })
})
