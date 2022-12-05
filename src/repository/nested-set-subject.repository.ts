import { EntityRepository } from "@mikro-orm/mysql";
import { NestedSetSubjectAbstract } from "../model/nested-set-subject.abstract";
import { Query } from "@mikro-orm/core/typings";
import { randomUUID } from "crypto";
import { CurrentLeftRightNode } from "./navigator/current-left-right-node.navigator";
import {SqlEntityManager} from "@mikro-orm/knex/SqlEntityManager";
import {EntityName} from "@mikro-orm/core";
import {NestedSetNodeOperator} from "../operator";

export abstract class NestedSetSubjectRepository<T extends NestedSetSubjectAbstract<T>> extends EntityRepository<T>{

  protected nestedSetNodeOperator: NestedSetNodeOperator<T>

  constructor(_em: SqlEntityManager, entityName: EntityName<T>) {
    super(_em, entityName);
    this.nestedSetNodeOperator = new NestedSetNodeOperator<T>()
  }

  async findReadableTreeWithDepth(depth: number) : Promise<NestedSetSubjectAbstract<Readonly<T>>> {
    return this.findAndBuildReadableTree({
      depth: depth
    })
  }

  async findReadableTree() : Promise<NestedSetSubjectAbstract<Readonly<T>>> {
    return this.findAndBuildReadableTree({})
  }

  async persistAndFlushTree(subject: NestedSetSubjectAbstract<T>) : Promise<void> {
    this.nestedSetNodeOperator.recomputeTree(subject)
    return this.persistAndFlush(subject)
  }

  async findWritableTree() : Promise<NestedSetSubjectAbstract<T>> {
    return await this.findOne({ parent: null } as unknown as NonNullable<Query<T>>)
  }

  protected async findAndBuildReadableTree(options: {
    //TODO: provide ability to pass custom query
    depth? : number
  }) : Promise<NestedSetSubjectAbstract<T>> {
    const rootsQuery = this.createQueryBuilder('root')
      .where({
        parent: null
      })

    const rootResult = (await rootsQuery.execute()).map(subject => this.map(subject))

    if(rootResult.length === 0) {
      return null
    }

    const root = rootResult[0]

    const query = {
      left: {
        $gte: root.left
      },
      right: {
        $lte: root.right
      }
    }

    if(options.depth){
      query['depth'] = {
        $lte: options.depth
      }
    }

    const subjects = (await this.createQueryBuilder('subject').where(query).execute()).map(subject => this.map(subject))

    for(const subject of subjects) {

      const children = subjects.filter(innerSubject => innerSubject?.parent?.getIdentifier() === subject.getIdentifier())

      if(children && children.length >=1) {
        subject.children.add(...children)
      }
    }

    return subjects[0] as NestedSetSubjectAbstract<T>
  }



}