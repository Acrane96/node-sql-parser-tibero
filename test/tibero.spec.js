const { expect } = require('chai')
const Parser = require('../src/parser').default

describe('Tibero', () => {
  const parser = new Parser();
  const opt = {
    database: 'tibero'
  }

  function getParsedSql(sql, opt) {
      const ast = parser.astify(sql, opt);
      return parser.sqlify(ast, opt);
  }

  const SQL_LIST = [
    {
      title: 'select with simple 陳 Query',
      sql: [
        `SELECT 陳 FrOm 박대연`,
        `SELECT 陳 FROM 박대연`
      ]
    },
    {
      title: 'select with simple Hangul Query',
      sql: [
        `SELECT 사랑, "합니다" FrOm "박대연"`,
        `SELECT 사랑, "합니다" FROM "박대연"`
      ]
    },
    {
      title: 'select with join keys, tab names, nested parenthese in where',
      sql: [
        `SELECT "col1", COL2, col3 FROM "user1".TAB1, "tab2", user3.TAB3, "user4"."tab4", user5."tab5" WHERE ("aa".col1(+) = "bb"."col2" (+)) or (aa.col4 = cc.col5(+))`,
        `SELECT "col1", COL2, COL3 FROM "user1".TAB1, "tab2", USER3.TAB3, "user4"."tab4", USER5."tab5" WHERE ("aa".COL1 (+) = "bb"."col2" (+)) OR (AA.COL4 = CC.COL5 (+))`
      ]
    },
    {
      title: 'Update Query With Sub Query',
      sql: [
        `UPDATE TEAM A SET A.E_TEAM_NAME = (SELECT X."stadium_name" FROM STADIUM X WHERE X.STADIUM_ID = A.STADIUM_ID)`,
        `UPDATE TEAM AS A SET A.E_TEAM_NAME = (SELECT X."stadium_name" FROM STADIUM AS X WHERE X.STADIUM_ID = A.STADIUM_ID)`
    ]
    },
    {
      title: 'FULL OUTER JOIN',
      sql: [
        `select * from dept FULL OUTER join dept_team on dept."deptno" = dept_team.deptno`,
        'SELECT * FROM DEPT FULL OUTER JOIN DEPT_TEAM ON DEPT."deptno" = DEPT_TEAM.DEPTNO'
      ]
    },
    {
      title: 'Innet Join',
      sql: [
        `select worker.empno, worker.ename, manager.ename from emp worker inner join emp manager on(worker.mgr = manager.empno)`,
        'SELECT WORKER.EMPNO, WORKER.ENAME, MANAGER.ENAME FROM EMP AS WORKER INNER JOIN EMP AS MANAGER ON (WORKER.MGR = MANAGER.EMPNO)'
      ]
    },
    {
      title: 'CROSS JOIN"',
      sql: [
        'SELECT * FROM sample.contacts a CROSS JOIN sample.customers b',
        'SELECT * FROM SAMPLE.CONTACTS AS A CROSS JOIN SAMPLE.CUSTOMERS AS B'
      ]
    },
    {
      title: 'Natural JOIN"',
      sql: [
        'SELECT * FROM SAMPLE.CONTACTS AS A Natural JOIN SAMPLE.CUSTOMERS AS B',
        'SELECT * FROM SAMPLE.CONTACTS AS A NATURAL JOIN SAMPLE.CUSTOMERS AS B'
      ]
    },
    {
      title: 'select implicit "comma cross join"',
      sql: [
        'SELECT * FROM "Roster", TeamMascot',
        'SELECT * FROM "Roster", TEAMMASCOT'
      ]
    },
    {
      title: 'select inner join using',
      sql: [
        `SELECT FirstName
        FROM "Roster" INNER JOIN PlayerStats
        USING (LastName);`,
        'SELECT FIRSTNAME FROM "Roster" INNER JOIN PLAYERSTATS USING (LASTNAME)'
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
