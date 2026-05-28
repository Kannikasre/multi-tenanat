IF COL_LENGTH('dbo.organizations', 'org_code') IS NULL
BEGIN
    ALTER TABLE dbo.organizations ADD org_code NVARCHAR(10) NULL;
END;
GO

IF EXISTS (SELECT 1 FROM dbo.organizations WHERE org_code IS NULL)
BEGIN
    DECLARE @organization_id INT;
    DECLARE @candidate_code NVARCHAR(10);

    DECLARE organization_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT id
        FROM dbo.organizations
        WHERE org_code IS NULL
        ORDER BY id;

    OPEN organization_cursor;
    FETCH NEXT FROM organization_cursor INTO @organization_id;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @candidate_code = NULL;

        WHILE @candidate_code IS NULL
        BEGIN
            SET @candidate_code = RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS NVARCHAR(6)), 6);

            IF EXISTS (SELECT 1 FROM dbo.organizations WHERE org_code = @candidate_code)
            BEGIN
                SET @candidate_code = NULL;
            END
        END

        UPDATE dbo.organizations
        SET org_code = @candidate_code
        WHERE id = @organization_id;

        FETCH NEXT FROM organization_cursor INTO @organization_id;
    END

    CLOSE organization_cursor;
    DEALLOCATE organization_cursor;
END;
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.organizations')
      AND name = 'org_code'
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE dbo.organizations ALTER COLUMN org_code NVARCHAR(10) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_organizations_org_code'
      AND object_id = OBJECT_ID('dbo.organizations')
)
BEGIN
    CREATE UNIQUE INDEX UX_organizations_org_code ON dbo.organizations(org_code);
END;
GO