# MikroORM nested set

This package is an open source extension for MikroORM, which enables Nested Set Tree for your needs

# Disclaimer
For now, this package doesn't support multiple trees, but it may change in near future

# Installation

```
npm install mikroorm-nested-set
```

# Setup

At first, you have to create a new entity-type class and extend NestedSetSubjectAbstract **(Keep in mind that you have to pass your entity for generic type)**

```typescript

import {NestedSetSubjectAbstract} from "mikroorm-nested-set";
import {Cascade, Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property} from "@mikro-orm/core";

@Entity()
export class CategoryFake extends NestedSetSubjectAbstract<CategoryFake>{

    @PrimaryKey({ type: 'number' })
    id: number;

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
        return this.id
    }

}

```

After that, you have to create a repository for your new entity. **(It's required for extra tree methods)**
```typescript
import {NestedSetSubjectRepository} from "mikroorm-nested-set";
import {CategoryFake} from "./category.fake";

export class CategoryFakeRepository extends NestedSetSubjectRepository<CategoryFake> {}
```

**Don't forget about migration file if you chose migration files way**

# Examples

## Create new tree
```typescript
const nestedSetNodeOperator = new NestedSetNodeOperator<Category>()

const mainCategory = new Category()
mainCategory.name = 'Main'
mainCategory.parent = null

const manCategory = new Category()
manCategory.name = 'man'

const womanCategory = new Category()
womanCategory.name = 'Woman'

nestedSetNodeOperator.addNode(manCategory, mainCategory, mainCategory)
nestedSetNodeOperator.addNode(womanCategory, mainCategory, mainCategory)

const famousShoesCategory = new Category()
famousShoesCategory.name = 'Famous shoes category'

const manJeans = new Category()
manJeans.name = 'Jeans'

nestedSetNodeOperator.addNode(manJeans, manCategory, mainCategory)
nestedSetNodeOperator.addNode(famousShoesCategory, womanCategory, mainCategory)

await this.categoryRepository.persistAndFlushTree(mainCategory)

```


## Update existing tree (Be aware of the difference between readableTree and writableTree)
```typescript
const writableTree = await this.categoryRepository.findWritableTree()
const nestedSetNodeOperator = new NestedSetNodeOperator<Category>()

const manShirtsCategory = new Category()
manShirtsCategory.name = 'man shirts'

const manShoesCategory = new Category()
manShirtsCategory.name = 'man shoes Category'


const nodeToRemove = nestedSetNodeOperator.findNodeInTree(writableTree, {
    getIdentifier(): number | string {
        return 124 // Just some random unneccessary category
    }
})

nestedSetNodeOperator.removeNode(nodeToRemove, writableTree)

const manCategory = nestedSetNodeOperator.findNodeInTree(writableTree, {
  getIdentifier(): number | string {
    return 2 // Man category
  }
})

nestedSetNodeOperator.addNode(manShirtsCategory, manCategory, writableTree)
nestedSetNodeOperator.addNode(manShoesCategory, manCategory, writableTree)

await this.categoryRepository.persistAndFlushTree(writableTree)
```

## Find and edit node property
```typescript
const writableTree = await this.categoryRepository.findWritableTree()
const nestedSetNodeOperator = new NestedSetNodeOperator<Category>()

// You can pass either whole object or object with getIdentifier implemanation
const nodeToEdit = nestedSetNodeOperator.findNodeInTree(writableTree, {
  getIdentifier(): number | string {
    return 124
  }
})

nodeToEdit.customProperty = '123'

await this.categoryRepository.persistAndFlushTree(writableTree)
```

# Tests

```cli
npm run test
```

# TODO

- More unit tests, especially with operator API
- Support for multiple trees

## Security

If you discover any security related issues, please email kamilfronczak@pm.me instead of using the issue tracker.

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
