import { EntityRepository } from "@mikro-orm/mysql";
import { NestedSetSubjectAbstract } from "../model/nested-set-subject.abstract";
import { Query } from "@mikro-orm/core/typings";
import {SqlEntityManager} from "@mikro-orm/knex/SqlEntityManager";
import {EntityName, QueryOrder} from "@mikro-orm/core";
import {NestedSetNodeOperator} from "../operator";
import { RootNotFoundException } from "../operator/exception/root-not-found.exception";

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
    root?: NestedSetSubjectAbstract<T> | T
    } = {}) : Promise<NestedSetSubjectAbstract<T>> {

    const root = options.root ? options.root : await this.findRoot()
    
    if(!root) {
      throw new RootNotFoundException(`Root of the tree was not found`)
    }
    
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

    const preparedQuery = this.createQueryBuilder('subject').select('*').where(query).orderBy({ depth: 'ASC' });

    if(options.relations) {
      for(const relation of options.relations) {
        preparedQuery.leftJoinAndSelect(relation.relationName, relation.alias)
      }
    }
      
    const results = await preparedQuery.execute()

    let subjects = []

    for(const result of results) {

      const subject = this.map(result)

      //Override children and turn it into simple array. We want to keep it simple and low memory
      //@ts-ignore
      subject.children = []

      subjects.push(subject)
    }

   
    const alreadyProcessedChildren = []

    for(const subject of subjects) {

      let children : any[] = []
      const alreadyAddedChildrenOnCurrentSubject = []

      // Find all children for given subject
      for(const potentialChild of subjects) {
        
        // Check if potential child is really a child of current subject
        if(subject?.getIdentifier() !== potentialChild?.parent?.getIdentifier()) {
          continue;
        }

        // Check if any of child is duplicate
        if(alreadyAddedChildrenOnCurrentSubject.includes(potentialChild.getIdentifier())) {
          continue;
        }

        // Check if any of child is duplicate in global scope. Should't happen anymore
        if(alreadyProcessedChildren.includes(potentialChild.getIdentifier())) {
          continue;
        }

        children.push(potentialChild)
        alreadyAddedChildrenOnCurrentSubject.push(potentialChild.getIdentifier())
      }

      subject.children.push(...children)

      for(const child of children) {
        alreadyProcessedChildren.push(child.getIdentifier())
      }
    }

    return subjects[0] as NestedSetSubjectAbstract<T>
  }

  private async findRoot(): Promise<NestedSetSubjectAbstract<T>> {
    const rootsQuery = this.createQueryBuilder('root')
      .where({
        parent: null
      })

    const rootResult = (await rootsQuery.execute()).map(subject => this.map(subject))

    if(rootResult.length === 0) {
      return null
    }

    return rootResult[0] as NestedSetSubjectAbstract<T>;
  }

}