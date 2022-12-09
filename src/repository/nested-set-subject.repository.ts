import { EntityRepository } from "@mikro-orm/mysql";
import { NestedSetSubjectAbstract } from "../model/nested-set-subject.abstract";
import { Query } from "@mikro-orm/core/typings";
import {SqlEntityManager} from "@mikro-orm/knex/SqlEntityManager";
import {EntityName} from "@mikro-orm/core";
import {NestedSetNodeOperator} from "../operator";

export abstract class NestedSetSubjectRepository<T extends NestedSetSubjectAbstract<T>> extends EntityRepository<T>{

  protected nestedSetNodeOperator: NestedSetNodeOperator<T>

  constructor(_em: SqlEntityManager, entityName: EntityName<T>) {
    super(_em, entityName);
    this.nestedSetNodeOperator = new NestedSetNodeOperator<T>()
  }

  async persistAndFlushTree(subject: NestedSetSubjectAbstract<T>) : Promise<void> {
    this.nestedSetNodeOperator.recomputeTree(subject)
    return this.persistAndFlush(subject)
  }

  async findWritableTree() : Promise<NestedSetSubjectAbstract<T>> {
    return await this.findOne({ parent: null } as unknown as NonNullable<Query<T>>)
  }

  async findReadableTree(options: {
    extraQuery?: Record<string, any>
    depth? : number,
    relations?: {
      relationName: string, // 'b.tags'
      alias: string // 't'
    }[]
  } = {}) : Promise<NestedSetSubjectAbstract<T>> {
    const rootsQuery = this.createQueryBuilder('root')
      .where({
        parent: null
      })

    const rootResult = (await rootsQuery.execute()).map(subject => this.map(subject))

    if(rootResult.length === 0) {
      return null
    }

    const root = rootResult[0]

    let query = {
      left: {
        $gte: root.left
      },
      right: {
        $lte: root.right
      }
    }

    if(options.extraQuery) {
      query = {
        ...query,
        ...options.extraQuery
      }
    }

    if(options.depth){
      query['depth'] = {
        $lte: options.depth
      }
    }

    const preparedQuery = this.createQueryBuilder('subject').select('*').where(query)

    if(options.relations) {
      for(const relation of options.relations) {
        preparedQuery.leftJoinAndSelect(relation.relationName, relation.alias)
      }
    }
      

    const subjects = (await preparedQuery.execute()).map(subject => this.map(subject))
    subjects.forEach(subject => subject.children = [])
    const alreadyProcessedChild = []

    for(const subject of subjects) {

      
      let children = subjects.filter(innerSubject => innerSubject?.parent?.getIdentifier() === subject.getIdentifier())
      
      if(children && children.length >=1) {
        const alreadyProcessedIds = []

        // Filter every child in children for duplicates
        children = children.filter(child => {
          if(alreadyProcessedIds.includes(child.getIdentifier())) {
            return false;
          }
          alreadyProcessedIds.push(child.getIdentifier())
          return child
        })

        // Filter duplicates on children level because of relations and joins
        children = children.filter(child => {
          return !alreadyProcessedChild.includes(child.getIdentifier())
        })

        subject.children.push(...children)
        children.forEach(child => alreadyProcessedChild.push(child.getIdentifier()))
      }
    }

    return subjects[0] as NestedSetSubjectAbstract<T>
  }



}