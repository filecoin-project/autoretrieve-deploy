import { Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxGeneration, AmazonLinuxImage, CfnEIP, CfnKeyPair, Instance,
  InstanceClass, InstanceSize, InstanceType, Peer, Port,
  SecurityGroup, SubnetType, Vpc
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { CustomDatabase } from '../constructs/custom-database';

export interface ServerStackProps extends StackProps {
  database: CustomDatabase
  ec2KeyPairName: string
  ec2InstanceName: string
  prefix: string
  vpc: Vpc
}

export class ServerStack extends Stack {
  readonly ec2: Instance
  readonly elasticIp: CfnEIP
  readonly securityGroup: SecurityGroup
  
  constructor(scope: Construct, id: string, props: ServerStackProps) {
    super(scope, id, props);
    
    this.securityGroup = new SecurityGroup(this, 'ServerSecurityGroup', {
      securityGroupName: `${props.prefix}ServerSecurityGroup`,
      vpc: props.vpc
    });

    // Allow SSH connection from anywhere
    this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), "from any IPv4 over SSH");

    // Allow connections from this EC2 instance to the database
    props.database.addIngressRule(this.securityGroup, Port.tcp(5432), "from the EC2 server", true);
    
    new CfnKeyPair(this, 'Ec2KeyPair', { keyName: props.ec2KeyPairName });
    this.ec2 = new Instance(this, 'EC2Instance', {
      keyName: props.ec2KeyPairName,
      instanceName: props.ec2InstanceName,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.LARGE),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      securityGroup: this.securityGroup,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC
      }
    });
  }
}