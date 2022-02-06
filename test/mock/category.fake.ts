import {NestedSetSubjectAbstract} from "../../src";
import {Cascade, Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property} from "@mikro-orm/core";

@Entity()
export class CategoryFake extends NestedSetSubjectAbstract<CategoryFake>{

    @PrimaryKey({ type: 'number' })
    id: number;

    @Property({type: 'varchar'})
    name: string;

    @Property({ type: 'number' })
    left: number;

    @Property({ type: 'number' })
    right: number;

    @Property({ type: 'number' })
    depth: number;

    @OneToMany({
        entity: () => CategoryFake,
        mappedBy: category => category.parent,
        cascade: [Cascade.ALL],
        eager: true,
        orphanRemoval: true
    })
    children = new Collection<CategoryFake>(this)

    @ManyToOne({
        entity: () => CategoryFake
    })
    parent: CategoryFake

    getIdentifier(): number | string {
        return undefined
    }

}