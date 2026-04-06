package com.mbsystem.MBSystem.repository.module;

import com.mbsystem.MBSystem.domain.Module;
import com.mbsystem.MBSystem.domain.QModule;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.mbsystem.MBSystem.domain.QModule.*;

@Repository
public class ModuleRepository {

  @Autowired
  private SDJpaModuleRepository moduleRepository;
  private EntityManager em;
  private JPAQueryFactory queryFactory;

  public ModuleRepository(EntityManager em) {
    this.em=em;
    this.queryFactory=new JPAQueryFactory(em);
  }

  public Module save(Module module) {
    return moduleRepository.save(module);
  }

  public List<Module> findAll() {
    return moduleRepository.findAll();
  }

  public List<Module> findByPlaceId(Long placeId) {
    QModule module = QModule.module;

    return queryFactory
        .selectFrom(module)
        .where(module.place.id.eq(placeId))
        .fetch();
  }

  public Optional<Module> findByModuleNumAndPlaceId(Long moduleNum, Long placeId) {

    Module result = queryFactory
        .selectFrom(module)
        .where(module.moduleNum.eq(moduleNum), module.place.id.eq(placeId))
        .fetchOne();

    return Optional.ofNullable(result);
  }

  public Module update(Module module) {
    return moduleRepository.save(module);
  }

  public void deleteById(Long id) {
    moduleRepository.deleteById(id);
  }

}
