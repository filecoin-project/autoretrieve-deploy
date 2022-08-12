import { Stack, StackProps } from "aws-cdk-lib";
import {
  AmazonLinuxGeneration, AmazonLinuxImage, CfnEIP, CfnKeyPair, Instance,
  InstanceClass, InstanceSize, InstanceType, Port,
  SecurityGroup, SubnetType, Vpc
} from "aws-cdk-lib/aws-ec2";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface ServerStackProps extends StackProps {
  database: DatabaseInstance
  databaseSecurityGroup: SecurityGroup
  vpc: Vpc
}

export class ServerStack extends Stack {
  readonly aRecord: ARecord;
  readonly ec2: Instance;
  readonly elasticIp: CfnEIP;
  readonly securityGroup: SecurityGroup;
  
  constructor(scope: Construct, id: string, props: ServerStackProps) {
    super(scope, id, props);
    
    this.securityGroup = new SecurityGroup(this, "Ec2DatabaseProxy", {
      vpc: props.vpc
    });
    props.databaseSecurityGroup.addIngressRule(this.securityGroup, Port.tcp(54342), "Allow connection from ec2 server", true);

    new CfnKeyPair(this, "Ec2KeyPair", { keyName: "autoretrieve-retrieval-events-server-key-pair" });
    this.ec2 = new Instance(this, "PGAdminInstance", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC
      },
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      instanceName: "autoretrieve-retrieval-events-pgadmin-instance",
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.LARGE),
      securityGroup: this.securityGroup,
      keyName: "autoretrieve-retrieval-events-server-key-pair"
    });

    // Allow SSH connection from anywhere
    this.ec2.connections.allowFromAnyIpv4(Port.tcp(22));
    // Allow database connection from pgAdmin to the database

    // props.database.connections.allowFrom(this.ec2, Port.tcp(5432));

    // Give the EC2 instance an elastic IP so that we can point our domain at it
    this.elasticIp = new CfnEIP(this, "Ec2ElasticIP", {
      instanceId: this.ec2.instanceId
    });

    // Reference the parent hosted zone
    const parentZone = HostedZone.fromLookup(this, "DevCidContactZone", {
      domainName: "dev.cid.contact" 
    });
    // Point domain at elastic IP
    this.aRecord = new ARecord(this, "ARecordEc2", {
      recordName: "pgadmin.autoretrieve.dev.cid.contact",
      target: RecordTarget.fromIpAddresses(this.elasticIp.ref),
      zone: parentZone
    });
  }
}