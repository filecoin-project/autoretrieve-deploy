import { Construct } from "constructs";
import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import { IPeer, IVpc, Port, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { IPrincipal, Grant } from "aws-cdk-lib/aws-iam";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { AwsCustomResource, PhysicalResourceId, AwsCustomResourcePolicy } from "aws-cdk-lib/custom-resources";

interface CustomDatabaseProps {
    prefix: string 
    vpc: IVpc
}

export class CustomDatabase extends Construct {
    readonly database: DatabaseInstance
    readonly secret: ISecret
    readonly securityGroup: SecurityGroup
    readonly username: string

    constructor(scope: Construct, id: string, props: CustomDatabaseProps) {
        super(scope, id);

        this.securityGroup = new SecurityGroup(this, `SecurityGroup`, {
            securityGroupName: `${props.prefix}${id}SecurityGroup`,
            vpc: props.vpc
        });

        // Create the database
        this.database = new DatabaseInstance(this, `${id}`, {
            backupRetention: Duration.days(0),
            credentials: Credentials.fromGeneratedSecret("postgres"),
            databaseName: `${props.prefix}Db`,
            deleteAutomatedBackups: true,
            engine: DatabaseInstanceEngine.postgres({
                version: PostgresEngineVersion.VER_14_2
            }),
            publiclyAccessible: false,
            removalPolicy: RemovalPolicy.RETAIN,
            securityGroups: [this.securityGroup],
            vpc: props.vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_ISOLATED
            }
        });
        this.secret = this.database.secret!;
        this.username = this.secret.secretValueFromJson("username").toString();
    }

    /**
     * Add an ingress rule on TCP port 5432 for the database"s security group 
     * @param peer 
     * @param description 
     * @param remoteRule 
     */
    public addIngressRule(peer: IPeer, connection: Port, description?: string | undefined, remoteRule?: boolean | undefined) {
        this.securityGroup.addIngressRule(peer, connection, description, remoteRule);
    }

    // Allow connections from a lambda
    public grantConnectFromLambda(scope: Construct, lambda: IFunction) {
        this.grantConnect(scope, lambda.role?.grantPrincipal!); // Give lambda permission to connect to db
        this.secret.grantRead(lambda); // Give lambda permission to read database secret
    }

    // Custom grantConnect function due to a bug in AWS where an RDS instance"s resource ID is not available from Cloudformation.
    // More information here: https://github.com/aws/aws-cdk/issues/11851
    private grantConnect(scope: Construct, grantPrincipal: IPrincipal) {
        // This could be undefined in some cases, just no op.
        if(grantPrincipal === undefined) {
            console.warn(`Could not grant connect to RDS instance ${this.database.instanceIdentifier} because grant principle is undefined.`);
            return;
        }

        // Custom resource for retrieving the DB Resource ID from an RDS instance using an SDK call
        const dbResourceId = new AwsCustomResource(scope, `RdsResourceId-${grantPrincipal}`, {
            onUpdate: {
                service: "RDS",
                action: "describeDBInstances",
                parameters: {
                    DBInstanceIdentifier: this.database.instanceIdentifier,
                },
                physicalResourceId: PhysicalResourceId.fromResponse(
                    "DBInstances.0.DbiResourceId"
                ),
                outputPaths: ["DBInstances.0.DbiResourceId"],
                },
                policy: AwsCustomResourcePolicy.fromSdkCalls({
                resources: AwsCustomResourcePolicy.ANY_RESOURCE,
            })
        });
        const resourceId = dbResourceId.getResponseField("DBInstances.0.DbiResourceId");

        // Ensure this custom resource waits for the DB instance lifecycle to complete before executing it"s own lifecycle
        dbResourceId.node.addDependency(this.database);

        // This is the correct ARN structure needed
        const dbUserArn = `arn:aws:rds-db:${Stack.of(scope).region}:${Stack.of(scope).account}:dbuser:${resourceId}/${this.username}`;

        // Add the rds-db:connect action and correct DB instance ARN to the grant principle
        Grant.addToPrincipal({
            grantee: grantPrincipal,
            actions: ["rds-db:connect"],
            resourceArns: [dbUserArn],
        });
    }
}