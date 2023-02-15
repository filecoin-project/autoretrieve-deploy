import { Construct } from "constructs";
import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { CustomDatabase } from "../constructs/custom-database";

interface DatabaseStackProps extends StackProps {
  prefix: string
  vpc: IVpc
}

export class DatabaseStack extends Stack {
  readonly database: CustomDatabase

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create the database
    this.database = new CustomDatabase(this, "Database", {
      prefix: props.prefix,
      vpc: props.vpc
    });

    // Output the Database endpoint and secret name
    new CfnOutput(this, "DatabaseEndpoint", {
      value: this.database.database.instanceEndpoint.hostname,
    });
    new CfnOutput(this, "DatabaseSecretName", {
      value: this.database.secret.secretName
    });
  }
}
