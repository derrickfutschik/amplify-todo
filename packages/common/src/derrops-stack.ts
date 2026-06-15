import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DerropsConventions } from 'derrops-conventions'

export abstract class DerropsStack extends Stack {
    protected conventions: DerropsConventions
    protected resource: DerropsConventions['resource']
    protected name: DerropsConventions['name']

    constructor({
        conventions,
        scope,
        id,
        props,
    }: {
        conventions: DerropsConventions
        scope: Construct
        id: string
        props?: StackProps
    }) {
        super(scope, id, { ...props, stackName: conventions.name({ type: 'cloudFormationStack' }) })
        this.conventions = conventions
        this.resource = conventions.resource.bind(conventions)
        this.name = conventions.name.bind(conventions)
        conventions
            .resource({ type: 'cloudFormationStack' })
            .applyTags((k, v) => this.tags.setTag(k, v))
    }
}
